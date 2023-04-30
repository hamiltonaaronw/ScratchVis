#version 410

// derived from https://glslsandbox.com/e#101803.0 



// actually derived from https://www.shadertoy.com/view/Dtd3z2

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform vec2 uRes;
uniform vec3 uSpec3;
uniform float uDeltaFreq;
uniform float uDeltaTime;
uniform float uFreq;
uniform float uLastFrame;
uniform float uLastFreq;
uniform float uSpecSum;
uniform float uTime;
uniform float uSpectrum[256];

out vec4 retColor;

#define S(x) sin(x + 2.0 * sin(x))
#define color(x) (cos((x + vec3(0.0, 0.3, 0.4)) * TAU) * 0.5 + 0.5)

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), -sin(a),
		sin(a), cos(a)
	);

	return ret;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	vec3 vf = uSpec3;
	float lvf;
	float t = uTime * 0.25;

	vf *= sin(t * (uSpecSum / 256) / TAU);
	lvf = length(vf);
	
	float tf = clamp((t * 0.5), vf.x, step(uFreq, lvf)) + f;
	float df = (abs(uLastFreq - uFreq) * 0.5);

	float i = 0.0;
	float d = 0.0;
	float e = 1.0;
	float co;

	vec3 q;
	vec3 qI;
	vec3 rd = normalize(vec3(0.0, 0.0, 1.0));
	rd.zy *= rot(p.y * 2.0);
	rd.xz *= rot(-p.x * 2.5 + S(uTime * 0.1) * 4.0 + 0.03 * S(t + p.x * 2.0));

	float a = (sin(uTime * 0.1) + 0.1);

	for (; i < 99.0 && e > 0.0001; i++)
	{
		q = d * rd;
		qI = q;
		
		float sz;
//sz = 0.25 * (sin(t) + 1.0);
		sz = 0.25 * 
			(uFreq > 0.00001 ? 
				abs(fract(uSpecSum - lvf) * atan(tf, df))
			: a);
		sz = max(sz, 0.1);

//q.z += (uTime * 0.5) + (sin(uTime) + 1.0) * 0.01;
		q.z += (uTime * 0.5) + 
			(uFreq > 0.00001 ? 
				a
			: a) * 0.01;

		q.zy = q.yz;
		float s;
		float ss = 1.5;

		s = 1.0 + 0.5 * S(qI.y * 2.0 - uTime);
		q.xz *= s;
		ss *= s;
		co = 0.0;

		for (float j = 0.0; j < 4.0; j++)
		{
			q.xz *= rot(t + S(uTime * 0.4 * 1.61 + qI.z * 1.0 + j));
			
			s = 3.0;
			ss *= s;
			q *= s;

			q.y += 0.5 + j / 10.0;
			q.y = fract(q.y) - 0.5;

//q = abs(q) - 0.5 - (sin(uTime) + 1.0) * 0.1 + 0.2 * S(qI.z * 0.1 + uTime * 0.1);
			q = abs(q) - 0.5 - 
				(uFreq > 0.00001 ? 
					a
				: a) *
				0.1 + 0.2 * S(qI.z * 0.1 + uTime * 0.1);

			if (q.z < q.x)
				q.xz = q.zx;
			if (q.y > q.x)
				q.xy = q.yx;

			co += length(q) * 0.01;
		}

		q -= clamp(q, -sz, sz);
		e = (length(q.xz) - 0.0001) / ss;
		d += e;
	}

	c = 10. / i * color(log(d) * 0.8 + co * 20.0 + uTime * 0.1);

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = c;// uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	uv = (gl_FragCoord.xy - 0.5 - uRes) / min(uRes.x, uRes.y) * .75;

	vec4 ret = vec4(col(uv), 1.0);

	retColor = ret;
}
